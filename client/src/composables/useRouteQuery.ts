import type { Ref } from 'vue-demi'
import { customRef, nextTick } from 'vue-demi'
import { toValue } from '@vueuse/shared'
import { useRouter } from 'vue-router'
import type { ReactiveRouteOptionsWithTransform, RouteQueryValueRaw } from './_types'

export function boolNullTransform<T extends 'true' | 'false' | 'null'>(v: T): boolean | null {
    switch (v) {
        case 'null': return null;
        case 'true': return true;
        case 'false': return false;
        default:
            return v;
    }
}

export function enumTransform<T extends object>(e: T, d: T[keyof T]) {
    const vals = Object.values(e);
    return (v: any) => vals.includes(v) ? v : d;
}

let cachedQuery: any

export function useRouteQuery(
    name: string
): Ref<null | string | string[]>

export function useRouteQuery<
    T extends RouteQueryValueRaw = RouteQueryValueRaw,
    K = T,
>(
    name: string,
    defaultValue?: T,
    options?: ReactiveRouteOptionsWithTransform<T, K>
): Ref<K>

export function useRouteQuery<
    T extends RouteQueryValueRaw = RouteQueryValueRaw,
    K = T,
>(
    name: string,
    defaultValue?: T,
    options: ReactiveRouteOptionsWithTransform<T, K> = {},
): Ref<K> {
    const {
        mode = 'replace',
        router = useRouter(),
        transform = value => value as any as K,
    } = options



    return customRef<any>((track, trigger) => ({
        get() {
            track()
            const data = router.currentRoute.value.query[name] ?? defaultValue
            return transform(data as T)
        },
        set(value) {
            if (typeof (value) === 'undefined') return
            const stringValue = String(value)

            if (!cachedQuery) {
                cachedQuery = { ...router.currentRoute.value.query }
                void nextTick(() => {
                    void router[toValue(mode)]({ query: cachedQuery })
                    cachedQuery = undefined
                })
            }

            if (stringValue === String(defaultValue) || value === defaultValue) {
                delete cachedQuery[name]
            } else {
                cachedQuery[name] = stringValue
            }

            trigger()

        },
    }))
}